const suggestions = document.getElementById('suggestions');
const search = document.getElementById('search');

const hideSuggestions = () => {
  suggestions?.classList.add('d-none');
};

if (search && suggestions) {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === '/') {
      event.preventDefault();
      search.focus();
      return;
    }

    if (event.key === 'Escape') {
      search.blur();
      hideSuggestions();
    }
  });

  document.addEventListener('click', (event) => {
    if (!suggestions.contains(event.target)) {
      hideSuggestions();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (suggestions.classList.contains('d-none')) return;

    const focusableSuggestions = [...suggestions.querySelectorAll('a')];
    if (focusableSuggestions.length === 0) return;

    const index = focusableSuggestions.indexOf(document.activeElement);

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusableSuggestions[Math.max(index - 1, 0)].focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusableSuggestions[Math.min(index + 1, focusableSuggestions.length - 1)].focus();
    }
  });

  /*
  Source:
    - https://github.com/nextapps-de/flexsearch#index-documents-field-search
    - https://raw.githack.com/nextapps-de/flexsearch/master/demo/autocomplete.html
  */
  const index = new FlexSearch.Document({
    tokenize: 'forward',
    cache: 100,
    document: {
      id: 'id',
      store: ['href', 'title', 'description'],
      index: ['title', 'description', 'content']
    }
  });

  {{ $list := slice }}
  {{- if and (isset .Site.Params.options "searchsectionsindex") (not (eq (len .Site.Params.options.searchSectionsIndex) 0)) }}
  {{- if eq .Site.Params.options.searchSectionsIndex "ALL" }}
  {{- $list = .Site.Pages }}
  {{- else }}
  {{- $list = (where .Site.Pages "Type" "in" .Site.Params.options.searchSectionsIndex) }}
  {{- if (in .Site.Params.options.searchSectionsIndex "HomePage") }}
  {{ $list = $list | append .Site.Home }}
  {{- end }}
  {{- end }}
  {{- else }}
  {{- $list = (where .Site.Pages "Section" "docs") }}
  {{- end }}

  {{ range $index, $element := $list -}}
    index.add({
      id: {{ $index }},
      href: {{ .RelPermalink | jsonify }},
      title: {{ .Title | jsonify }},
      description: {{ with .Description }}{{ . | jsonify }}{{ else }}{{ .Summary | plainify | jsonify }}{{ end }},
      content: {{ .Plain | jsonify }}
    });
  {{ end -}}

  search.addEventListener('input', ({ currentTarget }) => {
    const query = currentTarget.value.trim();
    suggestions.replaceChildren();

    if (!query) {
      hideSuggestions();
      return;
    }

    const results = index.search(query, { limit: 5, enrich: true });
    const documents = new Map();

    for (const result of results.flatMap(({ result: matches }) => matches)) {
      if (!documents.has(result.doc.href)) {
        documents.set(result.doc.href, result.doc);
      }
    }

    suggestions.classList.remove('d-none');

    if (documents.size === 0) {
      const message = document.createElement('div');
      message.classList.add('suggestion__no-results');
      message.textContent = `No results for "${query}"`;
      suggestions.appendChild(message);
      return;
    }

    for (const doc of [...documents.values()].slice(0, 5)) {
      const entry = document.createElement('div');
      const link = document.createElement('a');
      const title = document.createElement('span');
      const description = document.createElement('span');

      link.href = doc.href;
      title.textContent = doc.title;
      title.classList.add('suggestion__title');
      description.textContent = doc.description;
      description.classList.add('suggestion__description');

      link.append(title, description);
      entry.appendChild(link);
      suggestions.appendChild(entry);
    }
  });
}
